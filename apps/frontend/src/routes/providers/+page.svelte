<script lang="ts">
	import { user } from '$lib/state.svelte';
	import { onMount } from 'svelte';

	let dni = $state('');
	let loading = $state(false);
	let result = $state<any>(null);
	let provider = $state<'fnb' | 'gaso' | null>(null);
	let error = $state('');
	let healthStatus = $state<any>(null);
	let providersChecked = $state<string[]>([]);
	let providersUnavailable = $state<any>(null);

	onMount(async () => {
		if (!user.isAuthenticated) {
			window.location.href = '/login';
		}
		await loadHealth();
	});

	async function loadHealth() {
		try {
			const res = await fetch('/api/health');
			if (res.ok) {
				healthStatus = await res.json();
			}
		} catch (err) {
			console.error('Failed to load health status', err);
		}
	}

	async function handleQuery() {
		if (!/^\d{8}$/.test(dni)) {
			error = 'El DNI debe tener 8 dígitos';
			return;
		}

		loading = true;
		error = '';
		result = null;
		provider = null;
		providersChecked = [];
		providersUnavailable = null;

		try {
			const res = await fetch(`/api/providers/${dni}`);
			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Error al consultar';
				return;
			}

			result = data.result;
			provider = data.provider;
			providersChecked = data.providersChecked || [];
			providersUnavailable = data.providersUnavailable;
		} catch (err) {
			error = 'Error de conexión';
		} finally {
			loading = false;
			await loadHealth();
		}
	}

	function getReason(reason?: string) {
		const reasons: Record<string, string> = {
			not_found: 'Cliente no encontrado en el sistema',
			api_error: 'Error al consultar el sistema',
			provider_unavailable: 'Proveedor temporalmente no disponible',
			installation_pending: 'Instalación pendiente',
			service_cuts_exceeded: 'Excede cortes de servicio permitidos'
		};
		return reason ? reasons[reason] || reason : '';
	}
</script>

<main class="p-8">
	<div class="mb-6">
		<a href="/" class="text-blue-600 hover:underline text-sm">← Volver al inicio</a>
	</div>
	
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Consulta de Historial Crediticio</h1>
		<p class="text-gray-600">Ingresa el DNI del cliente para verificar elegibilidad</p>
		
		<!-- Health Status -->
		{#if healthStatus}
			<div class="mt-4 flex gap-3 text-sm">
				<div class="flex items-center gap-2">
					<span class="text-gray-600">FNB:</span>
					<span class="px-2 py-1 rounded text-xs font-medium {healthStatus.providers.fnb.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
						{healthStatus.providers.fnb.available ? 'Disponible' : 'Bloqueado'}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-gray-600">Gaso:</span>
					<span class="px-2 py-1 rounded text-xs font-medium {healthStatus.providers.gaso.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
						{healthStatus.providers.gaso.available ? 'Disponible' : 'Bloqueado'}
					</span>
				</div>
			</div>
		{/if}
	</div>

	<div class="bg-white rounded-lg shadow-md p-6 max-w-2xl">
		<div class="space-y-4">
			<!-- DNI Input -->
			<div>
				<label for="dni" class="block text-sm font-medium mb-2">
					DNI del Cliente
				</label>
				<input
					id="dni"
					type="text"
					bind:value={dni}
					placeholder="12345678"
					maxlength="8"
					class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
					disabled={loading}
				/>
			</div>

			<!-- Query Button -->
			<button
				onclick={handleQuery}
				disabled={loading || !dni}
				class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Consultando...' : 'Consultar'}
			</button>

			<!-- Error Message -->
			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			<!-- Results -->
			{#if result}
				<div class="mt-6 border-t pt-6">
					<h2 class="text-xl font-semibold mb-4">Resultados</h2>
					
					<div class="space-y-3">
						<!-- Providers Checked Info -->
						{#if providersChecked.length > 0}
							<div class="text-xs text-gray-500 mb-2">
								Proveedores consultados: {providersChecked.join(', ').toUpperCase()}
							</div>
						{/if}
						
						{#if providersUnavailable}
							<div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm mb-3">
								⚠️ Algunos proveedores no están disponibles temporalmente
							</div>
						{/if}

						<!-- Provider Source -->
						{#if provider}
							<div class="flex items-center gap-3">
								<span class="text-sm font-medium text-gray-600">Proveedor:</span>
								<span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
									{provider === 'fnb' ? 'FNB (Electrodomésticos)' : 'Gaso (Gasodoméstico)'}
								</span>
							</div>
						{/if}

						<!-- Eligibility Status -->
						<div class="flex items-center gap-3">
							<span class="text-sm font-medium text-gray-600">Estado:</span>
							<span class="px-3 py-1 rounded-full text-sm font-medium {result.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
								{result.eligible ? 'Elegible' : 'No Elegible'}
							</span>
						</div>

						<!-- Name -->
						{#if result.name}
							<div class="flex items-center gap-3">
								<span class="text-sm font-medium text-gray-600">Nombre:</span>
								<span class="text-sm">{result.name}</span>
							</div>
						{/if}

						<!-- Credit Line -->
						<div class="flex items-center gap-3">
							<span class="text-sm font-medium text-gray-600">Línea de Crédito:</span>
							<span class="text-sm font-semibold">
								S/ {result.credit.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</span>
						</div>

						<!-- NSE (only for Gaso) -->
						{#if provider === 'gaso' && result.nse !== undefined}
							<div class="flex items-center gap-3">
								<span class="text-sm font-medium text-gray-600">NSE:</span>
								<span class="text-sm">{result.nse}</span>
							</div>
						{/if}

						<!-- Reason (if not eligible) -->
						{#if !result.eligible && result.reason}
							<div class="flex items-start gap-3">
								<span class="text-sm font-medium text-gray-600">Motivo:</span>
								<span class="text-sm text-red-600">{getReason(result.reason)}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
