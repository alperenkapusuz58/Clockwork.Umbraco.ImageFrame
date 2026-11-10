import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: 'src/index.ts',
			formats: ['es'],
			fileName: 'clockwork-image-frame',
		},
		outDir: '../Clockwork.Umbraco.ImageFrame/wwwroot/App_Plugins/ClockworkImageFrame/dist',
		emptyOutDir: true,
		sourcemap: false,
		rollupOptions: {
			external: [/^@umbraco/],
		},
	},
});
