namespace Clockwork.Umbraco.ImageFrame;

public static class ImageFrameConstants
{
    /// <summary>Property editor (schema) alias, identical on Umbraco 13, 17 and 18.</summary>
    public const string PropertyEditorAlias = "Clockwork.ImageFrame";

    /// <summary>ImageSharp.Web command carrying the frame transform: zoom,x,y,rotation,flags.</summary>
    public const string FrameCommand = "cwframe";

    /// <summary>ImageSharp.Web command carrying the output size in pixels: width,height.</summary>
    public const string SizeCommand = "cwsize";

    /// <summary>ImageSharp.Web command carrying the background colour (hex without '#'). Absent = transparent.</summary>
    public const string BackgroundCommand = "cwbg";

    public static class Config
    {
        public const string Width = "width";
        public const string Height = "height";
        public const string MinZoom = "minZoom";
        public const string MaxZoom = "maxZoom";
        public const string AllowRotate = "allowRotate";
        public const string AllowFlip = "allowFlip";
        public const string Background = "background";
        public const string OutputFormat = "outputFormat";
        public const string Quality = "quality";
    }
}
