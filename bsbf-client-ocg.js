function bsbf_client_ocg(server_ipv4, server_port, uuid) {
  if (!server_ipv4 || !server_port || !uuid)
    throw new Error("Please provide server_ipv4, server_port, and uuid.");

  const bsbfResourcesUrl = "https://raw.githubusercontent.com/bondingshouldbefree/bsbf-resources/refs/heads/main";
  let packages = "bsbf-bonding kmod-sched kmod-sched-bpf kmod-nft-tproxy kmod-ifb";

  /* Generate the uci-defaults script. */
  return Promise.all([
    fetch(`${bsbfResourcesUrl}/resources-client/xray.json`).then(r => r.json()),
    fetch(`${bsbfResourcesUrl}/resources-shared/bsbf-plpmtu`).then(r => r.text()),
    fetch(`${bsbfResourcesUrl}/resources-client/bsbf-tcp-in-udp`).then(r => r.text())
  ]).then(([xrayConfig, plpmtuScript, tcpInUdpScript]) => {
    xrayConfig.outbounds[0].settings.address = server_ipv4;
    xrayConfig.outbounds[0].settings.port = parseInt(server_port);
    xrayConfig.outbounds[0].settings.id = uuid;

    const modifiedPlpmtu = plpmtuScript
      .replace(/^(PLPMTUD_NODE=")[^:]*/m, `$1${server_ipv4}`);

    const modifiedTcpInUdp = tcpInUdpScript
      .replace(/^PORT=.*/m, `PORT=${server_port}`)
      .replace(/^IPv4=.*/m, `IPv4="${server_ipv4}"`);

    const uciDefaults = [
      "# xray Configuration",
      "cat <<'EOF' > /etc/xray/config.json",
      JSON.stringify(xrayConfig, null, 2),
      "EOF",
      "",
      "# bsbf-plpmtu Configuration",
      "cat <<'EOF' > /usr/sbin/bsbf-plpmtu",
      modifiedPlpmtu + "EOF",
      "",
      "# bsbf-tcp-in-udp Configuration",
      "cat <<'EOF' > /usr/sbin/bsbf-tcp-in-udp",
      modifiedTcpInUdp + "EOF",
    ].join("\n") + "\n";

    return {
      defaultsParam: uciDefaults,
      packagesParam: packages.trim()
    };
  });
}
