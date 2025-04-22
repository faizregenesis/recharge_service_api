const ora = require("ora");
// import ora from "ora";

import cliProgress from "cli-progress";

const fetchWithProgress = async (fetchFunction: () => Promise<void>, taskName: string) => {
    const spinner = await ora(`⏳ ${taskName}...`).start();
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    progressBar.start(100, 0);

    try {
        await fetchFunction();
        for (let progress = 0; progress <= 100; progress += 20) {
            progressBar.update(progress);
            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        progressBar.update(100);
        progressBar.stop();
        spinner.succeed(`✅ ${taskName} completed.`);
    } catch (error: any) {
        progressBar.stop();
        spinner.fail(`❌ Failed to complete ${taskName}. Error: ${error.message}`);
    }
};

export {
    fetchWithProgress
}
