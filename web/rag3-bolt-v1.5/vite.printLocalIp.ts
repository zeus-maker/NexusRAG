import os from 'os';
import type { Plugin } from 'vite';

function isIpv4(net: os.NetworkInterfaceInfo) {
  return net.family === 'IPv4' || net.family === 4;
}

export function printLocalIpPlugin(): Plugin {
  return {
    name: 'print-local-ip',
    configureServer(server) {
      const print = () => {
        const addr = server.httpServer?.address();
        const port = typeof addr === 'object' && addr && 'port' in addr ? addr.port : 5173;
        const ips = Object.values(os.networkInterfaces() ?? {})
          .flatMap(n => n ?? [])
          .filter(n => isIpv4(n) && !n.internal)
          .map(n => n.address);

        console.log('\n  本机访问:');
        console.log(`  ➜  http://localhost:${port}/`);
        if (ips.length) {
          console.log('\n  局域网访问（Local IP）:');
          ips.forEach(ip => console.log(`  ➜  http://${ip}:${port}/`));
        } else {
          console.log('\n  局域网访问: 未检测到非回环 IPv4 地址');
        }
        console.log('');
      };

      server.httpServer?.once('listening', print);
    },
  };
}
