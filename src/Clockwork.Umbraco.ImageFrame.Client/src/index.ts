const SCHEMA_ALIAS = 'Clockwork.ImageFrame';
const UI_ALIAS = 'Clockwork.PropertyEditorUi.ImageFrame';

export const manifests: Array<UmbExtensionManifest> = [
	{
		type: 'propertyEditorSchema',
		alias: SCHEMA_ALIAS,
		name: 'Clockwork Image Frame',
		meta: {
			defaultPropertyEditorUiAlias: UI_ALIAS,
			settings: {
				properties: [
					{
						alias: 'width',
						label: '#clockworkImageFrame_settingWidth',
						description: '{#clockworkImageFrame_settingWidthDescription}',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Integer',
						config: [{ alias: 'min', value: 1 }],
					},
					{
						alias: 'height',
						label: '#clockworkImageFrame_settingHeight',
						description: '{#clockworkImageFrame_settingHeightDescription}',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Integer',
						config: [{ alias: 'min', value: 1 }],
					},
					{
						alias: 'minZoom',
						label: '#clockworkImageFrame_settingMinZoom',
						description: '{#clockworkImageFrame_settingMinZoomDescription}',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Decimal',
						config: [{ alias: 'step', value: 0.05 }],
					},
					{
						alias: 'maxZoom',
						label: '#clockworkImageFrame_settingMaxZoom',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Decimal',
						config: [{ alias: 'step', value: 0.05 }],
					},
					{ alias: 'allowRotate', label: '#clockworkImageFrame_settingAllowRotate', propertyEditorUiAlias: 'Umb.PropertyEditorUi.Toggle' },
					{ alias: 'allowFlip', label: '#clockworkImageFrame_settingAllowFlip', propertyEditorUiAlias: 'Umb.PropertyEditorUi.Toggle' },
					{
						alias: 'background',
						label: '#clockworkImageFrame_settingBackground',
						description: '{#clockworkImageFrame_settingBackgroundDescription}',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.EyeDropper',
						config: [{ alias: 'showAlpha', value: false }],
					},
					{
						alias: 'outputFormat',
						label: '#clockworkImageFrame_settingOutputFormat',
						description: '{#clockworkImageFrame_settingOutputFormatDescription}',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown',
						config: [
							{
								alias: 'items',
								value: [
									{ name: 'WebP', value: 'webp' },
									{ name: 'PNG', value: 'png' },
									{ name: 'JPG', value: 'jpg' },
									{ name: 'Original', value: 'auto' },
								],
							},
						],
					},
					{
						alias: 'quality',
						label: '#clockworkImageFrame_settingQuality',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Integer',
						config: [
							{ alias: 'min', value: 1 },
							{ alias: 'max', value: 100 },
						],
					},
				],
				defaultData: [
					{ alias: 'width', value: 300 },
					{ alias: 'height', value: 150 },
					{ alias: 'minZoom', value: 0.2 },
					{ alias: 'maxZoom', value: 4 },
					{ alias: 'allowRotate', value: true },
					{ alias: 'allowFlip', value: true },
					{ alias: 'outputFormat', value: ['webp'] },
					{ alias: 'quality', value: 90 },
				],
			},
		},
	},
	{
		type: 'propertyEditorUi',
		alias: UI_ALIAS,
		name: 'Clockwork Image Frame',
		element: () => import('./property-editor-ui-image-frame.element.js'),
		meta: {
			label: 'Image Frame',
			icon: 'icon-crop',
			group: 'media',
			propertyEditorSchemaAlias: SCHEMA_ALIAS,
			supportsReadOnly: true,
		},
	},
	{
		type: 'modal',
		alias: 'Clockwork.Modal.ImageFrameEditor',
		name: 'Clockwork Image Frame Editor',
		element: () => import('./frame-editor-modal.element.js'),
	},
	{
		type: 'localization',
		alias: 'Clockwork.ImageFrame.Localization.En',
		name: 'Clockwork Image Frame English',
		meta: { culture: 'en' },
		js: () => import('./lang/en.js'),
	},
	{
		type: 'localization',
		alias: 'Clockwork.ImageFrame.Localization.Tr',
		name: 'Clockwork Image Frame Turkish',
		meta: { culture: 'tr' },
		js: () => import('./lang/tr.js'),
	},
];
