class ServiceWorkerHelpers {
    static updated = [];

    static setup() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/serviceWorker.js", {
                updateViaCache: "none", // disable caching, because it is now handled by the service worker
            }).then(reg => {
                reg.onupdatefound = () => {
                    const newWorker = reg.installing;

                    newWorker.onstatechange = () => {
                        if (newWorker.state === "installed") {
                            if (navigator.serviceWorker.controller) {
                                // A new update is available
                                console.log("New update available, refresh to update.");
                                if (confirm("A new version of the app is available. Refresh?")) {
                                    window.location.reload();
                                }
                            } else {
                                console.log("Service Worker installed for the first time.");
                            }
                        }
                    };
                };

                navigator.serviceWorker.addEventListener("message", event => {
                    if (event.data && event.data.type === "RESOURCE_UPDATED") {
                        const resource = event.data.resource;
                        ServiceWorkerHelpers.updateReceived(resource);
                    }
                });
            });
        }
    }

    static updateReceived(resource) {
        console.log("New version found for resource (reload to update):", resource);
        ServiceWorkerHelpers.updated.push(resource);

        //if (confirm(`A resource has been updated (${resource}). Refresh to apply updates?`)) {
        //    window.location.reload();
        //}
    }

    static tryPromptUpdate() {
        if (this.updated.length == 0) return;

        if (confirm(`Refresh to apply updates?`)) {
            window.location.reload();
        }
    }
}

ServiceWorkerHelpers.setup();