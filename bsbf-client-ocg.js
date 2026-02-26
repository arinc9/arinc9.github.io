function bsbf_client_ocg(server_ipv4, server_port, uuid, ocg_args) {
  let packages = "bsbf-bonding kmod-sched kmod-sched-bpf kmod-nft-tproxy";

  /* Parse arguments. */
  const ocgArgs = ocg_args.split(/\s+/).filter(arg => arg.length > 0);

  for (const arg of ocgArgs) {
    switch (arg) {
      case "--dongle-modem":
        packages += " bsbf-usb-netdev-autodhcp kmod-usb-net-cdc-ether usb-modeswitch";
        break;
      case "--quectel-modem":
        packages += " bsbf-quectel-usbnet kmod-usb-serial-option umbim";
        break;
      case "--usb-adapters-and-android-tethering":
        packages += " bsbf-usb-netdev-autodhcp kmod-usb-net-cdc-ether kmod-usb-net-rtl8152 kmod-usb-net-rndis";
        break;
      case "--ios-tethering":
        packages += " bsbf-usb-netdev-autodhcp kmod-usb-net-ipheth usbmuxd";
        break;
      case "--mikrotik-tools":
        packages += " mac-telnet-client mac-telnet-discover mac-telnet-ping mac-telnet-server";
        break;
      case "--diag-tools":
        packages += " bsbf-netspeed curl htop ss kmod-inet-mptcp-diag";
        break;
      case "--perf-test":
        packages += " kmod-sched-flower kmod-veth coreutils-nproc iperf3";
        break;
    }
  }

  if (!server_ipv4 || !server_port || !uuid)
    throw new Error("Please provide server_ipv4, server_port, and uuid.");

  const bsbfResourcesUrl = "https://raw.githubusercontent.com/bondingshouldbefree/bsbf-resources/refs/heads/main";

  /* Generate the uci-defaults script. */
  let uciDefaults = "";

  return Promise.all([
    fetch(`${bsbfResourcesUrl}/resources-client/xray.json`).then(r => r.json()).catch(() => null),
    fetch(`${bsbfResourcesUrl}/resources-client/bsbf-tcp-in-udp`).then(r => r.text()).catch(() => null)
  ]).then(([xrayConfig, tcpInUdpScript]) => {
    let finalDefaults = uciDefaults;

    // Substitute xray config values
    if (xrayConfig) {
      xrayConfig.outbounds[0].settings.address = server_ipv4;
      xrayConfig.outbounds[0].settings.port = parseInt(server_port);
      xrayConfig.outbounds[0].settings.id = uuid;

      finalDefaults += `# xray Configuration
cat <<'EOF' > /etc/xray/config.json
${JSON.stringify(xrayConfig, null, 2)}
EOF
`;
    }

    // Add bsbf-tcp-in-udp script
    if (tcpInUdpScript) {
      const modifiedTcpInUdp = tcpInUdpScript
        .replace(/^BASE_PORT=.*/m, `BASE_PORT=${server_port}`)
        .replace(/^IPv4=.*/m, `IPv4="${server_ipv4}"`);

      finalDefaults += `
# bsbf-tcp-in-udp Configuration
cat <<'EOF' > /usr/sbin/bsbf-tcp-in-udp
${modifiedTcpInUdp}EOF
`;
    }

    return {
      defaultsParam: finalDefaults,
      packagesParam: packages.trim()
    };
  });
}
