const a = "Clockwork.ImageFrame", e = "Clockwork.PropertyEditorUi.ImageFrame", o = [
  {
    type: "propertyEditorSchema",
    alias: a,
    name: "Clockwork Image Frame",
    meta: {
      defaultPropertyEditorUiAlias: e,
      settings: {
        properties: [
          {
            alias: "width",
            label: "#clockworkImageFrame_settingWidth",
            description: "{#clockworkImageFrame_settingWidthDescription}",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Integer",
            config: [{ alias: "min", value: 1 }]
          },
          {
            alias: "height",
            label: "#clockworkImageFrame_settingHeight",
            description: "{#clockworkImageFrame_settingHeightDescription}",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Integer",
            config: [{ alias: "min", value: 1 }]
          },
          {
            alias: "minZoom",
            label: "#clockworkImageFrame_settingMinZoom",
            description: "{#clockworkImageFrame_settingMinZoomDescription}",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Decimal",
            config: [{ alias: "step", value: 0.05 }]
          },
          {
            alias: "maxZoom",
            label: "#clockworkImageFrame_settingMaxZoom",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Decimal",
            config: [{ alias: "step", value: 0.05 }]
          },
          { alias: "allowRotate", label: "#clockworkImageFrame_settingAllowRotate", propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle" },
          { alias: "allowFlip", label: "#clockworkImageFrame_settingAllowFlip", propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle" },
          {
            alias: "background",
            label: "#clockworkImageFrame_settingBackground",
            description: "{#clockworkImageFrame_settingBackgroundDescription}",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.EyeDropper",
            config: [{ alias: "showAlpha", value: !1 }]
          },
          {
            alias: "outputFormat",
            label: "#clockworkImageFrame_settingOutputFormat",
            description: "{#clockworkImageFrame_settingOutputFormatDescription}",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
            config: [
              {
                alias: "items",
                value: [
                  { name: "WebP", value: "webp" },
                  { name: "PNG", value: "png" },
                  { name: "JPG", value: "jpg" },
                  { name: "Original", value: "auto" }
                ]
              }
            ]
          },
          {
            alias: "quality",
            label: "#clockworkImageFrame_settingQuality",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Integer",
            config: [
              { alias: "min", value: 1 },
              { alias: "max", value: 100 }
            ]
          }
        ],
        defaultData: [
          { alias: "width", value: 300 },
          { alias: "height", value: 150 },
          { alias: "minZoom", value: 0.2 },
          { alias: "maxZoom", value: 4 },
          { alias: "allowRotate", value: !0 },
          { alias: "allowFlip", value: !0 },
          { alias: "outputFormat", value: ["webp"] },
          { alias: "quality", value: 90 }
        ]
      }
    }
  },
  {
    type: "propertyEditorUi",
    alias: e,
    name: "Clockwork Image Frame",
    element: () => import("./property-editor-ui-image-frame.element-DbZ_KWEs.js"),
    meta: {
      label: "Image Frame",
      icon: "icon-crop",
      group: "media",
      propertyEditorSchemaAlias: a,
      supportsReadOnly: !0
    }
  },
  {
    type: "modal",
    alias: "Clockwork.Modal.ImageFrameEditor",
    name: "Clockwork Image Frame Editor",
    element: () => import("./frame-editor-modal.element-BdO5G8jJ.js")
  },
  {
    type: "localization",
    alias: "Clockwork.ImageFrame.Localization.En",
    name: "Clockwork Image Frame English",
    meta: { culture: "en" },
    js: () => import("./en-Dg6RFiYA.js")
  },
  {
    type: "localization",
    alias: "Clockwork.ImageFrame.Localization.Tr",
    name: "Clockwork Image Frame Turkish",
    meta: { culture: "tr" },
    js: () => import("./tr-BCAJLwRR.js")
  }
];
export {
  o as manifests
};
