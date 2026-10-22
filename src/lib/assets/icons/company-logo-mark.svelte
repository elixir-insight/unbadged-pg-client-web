<script lang="ts">
	let {
		width = '30',
		height,
		class: className
	}: {
		width?: string;
		height?: string;
		class?: string;
	} = $props();
</script>

<svg
	{width}
	{height}
	class={className}
	viewBox="0 0 155 158"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path
		d="M69.5 0C76.0606 0.802473 79.197 2.20963 83.5 7L153 77.5C160.183 118.806 141.42 135.156 92 133L89.5 157.5H61.5L32.3301 127.382L58.1387 129.986L60.9746 101.877L92.1992 104.097C108.726 105.271 123.075 92.8255 124.25 76.2988L125.027 65.3594C126.202 48.8325 113.756 34.4821 97.2295 33.3076L51.1592 30.0332L40.915 29L31.1133 126.125L0 94L14.5 0H69.5Z"
		fill="var(--logo-primary)"
	/>
</svg>
