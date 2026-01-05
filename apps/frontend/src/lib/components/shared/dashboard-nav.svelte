<script lang="ts">
import { page } from "$app/stores";
import { auth } from "$lib/state/auth.svelte";

const breadcrumbLabels: Record<string, string> = {
  "/dashboard/conversations": "Conversaciones",
  "/dashboard/catalog": "Catálogo",
  "/dashboard/providers": "Proveedores",
  "/dashboard/simulator": "Simulador",
  "/dashboard/stats": "Analytics",
  "/dashboard/reports": "Reportes",
  "/dashboard/orders": "Órdenes",
  "/dashboard/admin": "Administración",
  "/dashboard/personas": "Personas",
  "/dashboard/personas/create": "Crear",
};

$: crumbs = (() => {
  const path = $page.url.pathname;
  const segments = path.split("/").filter(Boolean);
  let currentPath = "";
  const trail: { label: string; href: string }[] = [];

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = breadcrumbLabels[currentPath];
    if (label) {
      trail.push({
        label,
        href: currentPath,
      });
    }
  }
  return trail;
})();
</script>

<nav class="border-b border-ink-900/10 bg-cream-50 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
	<div class="flex items-baseline gap-2 group">
		<a href="/dashboard" class="font-serif font-bold italic text-xl hover:text-ink-600 transition-colors">
			totem
		</a>
		{#each crumbs as crumb, i}
			<span class="text-ink-400 text-sm">/</span>
			{#if i === crumbs.length - 1}
				<span class="text-xs uppercase tracking-widest font-bold text-ink-400">
					{crumb.label}
				</span>
			{:else}
				<a 
					href={crumb.href}
					class="text-xs uppercase tracking-widest font-bold text-ink-400 hover:text-ink-900 transition-colors"
				>
					{crumb.label}
				</a>
			{/if}
		{/each}
	</div>

	<div class="flex items-center gap-6 text-xs font-mono">
		<span class="text-ink-600">
			{auth.user?.name || auth.user?.username} ({auth.user?.role})
		</span>
		<button
			onclick={() => auth.logout()}
			class="hover:underline text-red-600"
		>
			Salir
		</button>
	</div>
</nav>
