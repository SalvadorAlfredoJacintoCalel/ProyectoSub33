namespace Backend_Sub33.Common;

public static class TextNormalizer
{
    /// <summary>
    /// Normaliza un nombre propio: recorta espacios y aplica capitalización
    /// tipo título ("juan PÉREZ" -> "Juan Pérez"). Retorna null si está vacío.
    /// </summary>
    public static string? NormalizeName(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var palabras = text.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var resultado = palabras.Select(p => char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant());
        return string.Join(' ', resultado);
    }

    /// <summary>
    /// Normaliza una descripción: recorta espacios. Retorna null si está vacío.
    /// </summary>
    public static string? NormalizeDescription(string? text)
        => string.IsNullOrWhiteSpace(text) ? null : text.Trim();
}
