<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/state.svelte';

	onMount(async () => {
		if (!user.isAuthenticated) {
			window.location.href = '/login';
		}
	});
</script>

<main class="p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Panel de Control - Totem</h1>
		<p class="text-gray-600">Sistema de ventas WhatsApp para Calidda</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
		<a href="/conversations" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
			<div class="text-3xl mb-3">💬</div>
			<h2 class="text-xl font-semibold mb-2">Conversaciones</h2>
			<p class="text-gray-600 text-sm">Gestiona conversaciones activas con clientes</p>
		</a>

		<a href="/catalog" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
			<div class="text-3xl mb-3">📦</div>
			<h2 class="text-xl font-semibold mb-2">Catálogo</h2>
			<p class="text-gray-600 text-sm">Administra productos FNB y Gaso</p>
		</a>

		<a href="/providers" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
			<div class="text-3xl mb-3">🔍</div>
			<h2 class="text-xl font-semibold mb-2">Proveedores</h2>
			<p class="text-gray-600 text-sm">Consulta elegibilidad de clientes</p>
		</a>
	</div>

	{#if user.data}
		<div class="mt-8 p-4 bg-gray-50 rounded-lg max-w-4xl">
			<p class="text-sm text-gray-600">Sesión activa: <span class="font-semibold">{user.data.username}</span> ({user.data.role})</p>
			<button onclick={() => user.logout()} class="mt-2 text-sm text-red-600 hover:underline">
				Cerrar sesión
			</button>
		</div>
	{/if}
</main>
