using System.Globalization;
using System.Text.RegularExpressions;

namespace Clockwork.Umbraco.ImageFrame.Models;

internal static partial class ColorHelper
{
    [GeneratedRegex("^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")]
    private static partial Regex HexRegex();

    public static bool IsTransparent(string? value) => NormalizeHex(value) is null;

    /// <summary>Returns the colour as 6 or 8 lowercase hex digits without '#', or null when it isn't a valid hex colour.</summary>
    public static string? NormalizeHex(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var match = HexRegex().Match(value.Trim());
        if (!match.Success)
        {
            return null;
        }

        var hex = match.Groups[1].Value.ToLower(CultureInfo.InvariantCulture);
        return hex.Length == 3 ? string.Concat(hex.Select(c => new string(c, 2))) : hex;
    }
}
