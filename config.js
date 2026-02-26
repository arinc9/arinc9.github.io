/* exported config */

var config = {
  // Show help text for images
  show_help: true,

  // Pre-selected version (optional if provided by .versions.json)
  default_version: "SNAPSHOT",

  // Insert snapshot versions (optional)
  show_snapshots: true,

  // Image download URL (e.g. "https://downloads.openwrt.org")
  image_url: "https://downloads.openwrt.org",

  // Info link URL (optional)
  info_url: "https://openwrt.org/start?do=search&id=toh&q={title} @toh",

  // Attended Sysupgrade Server support (optional)
  asu_url: "https://sysupgrade.openwrt.org",
  asu_extra_packages: ["luci"],
};
