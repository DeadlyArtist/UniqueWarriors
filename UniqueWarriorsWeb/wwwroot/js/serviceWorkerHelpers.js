class ServiceWorkerHelpers {
    static setup() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/serviceWorker.js").then(reg => {
                reg.onupdatefound = () => {
                    const newWorker = reg.installing;

                    newWorker.onstatechange = () => {
                        if (newWorker.state === "installed") {
                            if (navigator.serviceWorker.controller) {
                                // A new update is available
                                console.log("New update available, refresh to update.");
                                alert("Update available! Reload to get the latest version.");
                            } else {
                                console.log("Service Worker installed for the first time.");
                            }
                        }
                    };
                };
            });
        }

    }
}

ServiceWorkerHelpers.setup();