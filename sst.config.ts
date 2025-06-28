// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "aws-tanstack-start",
            removal: input?.stage === "production" ? "retain" : "remove",
            protect: ["production"].includes(input?.stage),
            home: "aws",
            providers: {
                aws: {
                    profile:
                        input.stage === "production" ? "jknm-production" : "jknm-dev",
                },
                cloudflare: "6.3.1",
            },
        };
    },
    async run() {
        const TANSTACK_TARGET = $app.stage === "production"
            ? "aws-lambda"
            : "node-server"

        const domain_name = "new.jknm.site";

        const VITE_BASE_URL = $app.stage === "production"
            ? `https://${domain_name}`
            : "http://localhost:3000";

        const bucket = new sst.aws.Bucket("MyBucket", {
            access: "public",
        });

        new sst.aws.TanStackStart("MyWeb", {
            link: [bucket],
            environment: {
                TANSTACK_TARGET,
                VITE_BASE_URL
            },
            domain: {
                name: domain_name,
                dns: sst.cloudflare.dns()
            },
        });
    },
});
