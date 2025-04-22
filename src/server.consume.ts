import dotenv from 'dotenv';
import cron from 'node-cron';
import dns from 'dns';

dotenv.config();

import {
  // runDownloadFileInOrder,
  runFetchFunctionsInOrder, 
} from './order.sync.manager';

const synchInOrder = async () => {
  try {
    // await runDownloadFileInOrder();
    await runFetchFunctionsInOrder();
  } catch (error) {
    console.error('Error occurred while executing functions:', error);
  }
};

cron.schedule('*/20 * * * *', async () => {
  console.log('🔄 Running scheduled task: runFunctionsInOrder');
  await synchInOrder();
});

async function checkInternetConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    dns.lookup('google.com', (err) => {
      resolve(!err);
    });
  });
}

let wasOnline = false;
let isChecking = false;

async function handleInternetConnection() {
  if (isChecking) return;
  isChecking = true;

  const isConnected = await checkInternetConnection();

  if (isConnected && !wasOnline) {
    console.log('✅ Internet connected. Running scheduled task: runFunctionsInOrder');
    await synchInOrder();
    console.log("✔️ Task completed, checking again after finishing execution...");
    wasOnline = true;
  } else if (!isConnected) {
    console.log('❌ No internet connection.');
    wasOnline = false;
  }

  isChecking = false;
  setTimeout(handleInternetConnection, 90000);
}

handleInternetConnection();

cron.schedule('*/3 * * * *', async () => {
  if (!wasOnline) {
    console.log('⏳ Rechecking connection for scheduled task...');
    await handleInternetConnection();
  } else {
    console.log('⚡ Still online, skipping task.');
  }
});

const bind = process.env.BIND || '0.0.0.0:3002';
console.log(`Listening on ${bind}`);
console.log(`Localhost: http://${bind}`);

const serverConsume = {};
export default serverConsume;
