import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes("node_modules")) {
                        return;
                    }
                    if (id.includes("ethers")) {
                        return "ethers-vendor";
                    }
                    if (id.includes("react-toastify")) {
                        return "toast-vendor";
                    }
                    if (id.includes("react")) {
                        return "react-vendor";
                    }
                    return "vendor";
                }
            }
        }
    },
    server: {
        host: "0.0.0.0",
        port: 5173
    }
});
