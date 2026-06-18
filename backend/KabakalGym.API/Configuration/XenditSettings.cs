namespace KabakalGym.API.Configuration;

public class XenditSettings
{
    public const string SectionName = "Xendit";

    public string SecretKey { get; set; } = string.Empty;
    public string WebhookVerificationToken { get; set; } = string.Empty;
}
