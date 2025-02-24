import {
    consumeUserData
} from './routes/comsume_user/consumer.pod.user';


const runFunctionsInOrder = async () => {
    try {
        await consumeUserData()

        console.log('All functions executed successfully in order');
    } catch (error) {
        console.error('Error occurred while executing functions:', error);
    }
};

export {
    runFunctionsInOrder
}
