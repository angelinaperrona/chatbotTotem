<script lang="ts">
import type { Snippet } from "svelte";

type Props = {
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  class?: string;
  type?: "button" | "submit" | "reset";
  href?: string;
  onclick?: (e: MouseEvent) => void;
  children: Snippet;
};

let {
  variant = "primary",
  disabled = false,
  class: className = "",
  type = "button",
  href,
  onclick,
  children,
}: Props = $props();

const baseStyles =
  "px-6 py-3 min-h-10 rounded-full transition-all duration-200 font-medium text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 touch-action-manipulation inline-flex items-center justify-center text-center";

const variants = {
  primary: "bg-ink-900 text-cream-50 hover:bg-ink-600 focus-visible:bg-ink-600",
  secondary:
    "bg-transparent border border-ink-200 text-ink-900 hover:bg-ink-50 hover:border-ink-900 focus-visible:bg-ink-50 focus-visible:border-ink-900",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-50 focus-visible:bg-ink-50",
};
</script>

{#if href}
	<a
		{href}
		class="{baseStyles} {variants[variant]} {className}"
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-disabled={disabled}
	>
		{@render children()}
	</a>
{:else}
	<button
		{type}
		{disabled}
		{onclick}
		class="{baseStyles} {variants[variant]} {className}"
	>
		{@render children()}
	</button>
{/if}
