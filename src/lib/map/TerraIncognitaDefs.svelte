<script lang="ts">
	import { mapSettings } from '../settings';
	let terraIncognitaLightStripeColor = $derived(
		`rgb(${Math.min(
			255,
			$mapSettings.terraIncognitaBrightness + 10,
		)},${Math.min(255, $mapSettings.terraIncognitaBrightness + 10)},${Math.min(
			255,
			$mapSettings.terraIncognitaBrightness + 10,
		)})`,
	);
	let terraIncognitaDarkStripeColor = $derived(
		`rgb(${Math.max(
			0,
			$mapSettings.terraIncognitaBrightness - 10,
		)},${Math.max(0, $mapSettings.terraIncognitaBrightness - 10)},${Math.max(
			0,
			$mapSettings.terraIncognitaBrightness - 10,
		)})`,
	);
</script>

{#if $mapSettings.terraIncognita && $mapSettings.terraIncognitaStyle === 'striped'}
	<pattern
		id="dark-stripes"
		viewBox="0,0,10,10"
		preserveAspectRatio="none"
		width="100%"
		height="10"
		patternUnits="userSpaceOnUse"
		patternTransform="rotate(-45)"
	>
		<rect fill={terraIncognitaLightStripeColor} width="10" height="6" />
		<rect fill={terraIncognitaDarkStripeColor} width="10" height="6" y="5" />
	</pattern>
{/if}
{#if $mapSettings.terraIncognita && $mapSettings.terraIncognitaStyle === 'cloudy'}
	<filter id="terra-incognita-filter">
		<feGaussianBlur in="SourceGraphic" result="blurred" stdDeviation="2" />
		<feTurbulence type="turbulence" numOctaves="4" baseFrequency="0.02" result="turbulence" />
		<feColorMatrix
			type="matrix"
			in="turbulence"
			result="grayturb"
			values="
          0.2126 0.7152 0.0722 0 0
          0.2126 0.7152 0.0722 0 0
          0.2126 0.7152 0.0722 0 0
          0 0 0 1 0"
		/>
		<feBlend in2="blurred" in="grayturb" result="cloudy" mode="multiply" />
		<feComposite in="cloudy" in2="blurred" operator="in" />
	</filter>
{/if}
