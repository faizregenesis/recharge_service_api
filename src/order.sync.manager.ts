import {
    consumeUserData, 
    consumeUsersDataUpdate, 
    consumeResetPassword
} from './routes/comsume_user/consumer.pod.user';

import {
    fetchInitialSocketTopic, 
    fetchInitialPodTopic
} from './routes/spread_socket_topic/spread.socket.topic.controller';


const runInitialFetchingData = async () => {
    try {
        await fetchInitialSocketTopic()
        await fetchInitialPodTopic()

    } catch (error) {
        console.error('Error occurred while executing functions:', error);
    }
};

const runFunctionsInOrder = async () => {
    try {
        await consumeUserData()
        await consumeUsersDataUpdate()
        await consumeResetPassword()

        console.log('All functions executed successfully in order');
    } catch (error) {
        console.error('Error occurred while executing functions:', error);
    }
};

export {
    runFunctionsInOrder, 
    runInitialFetchingData
}
