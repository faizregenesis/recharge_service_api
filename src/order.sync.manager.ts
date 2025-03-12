import {
    consumeUserData, 
    consumeUsersDataUpdate, 
    consumeResetPassword
} from './routes/comsume_user/consumer.pod.user';

import {
    syncDisclaimerData
} from './routes/consumeDisclaimer/consume.disclaimer';

import {
    consumeUpdateQuestionMatrix, 
} from './routes/consume_matrix/consumer.matrix';

const runFunctionsInOrder = async () => {
    try {
        await consumeUserData()
        await consumeUsersDataUpdate()
        await consumeResetPassword()
        await syncDisclaimerData()
        await consumeUpdateQuestionMatrix(), 

        console.log('All functions executed successfully in order');
    } catch (error) {
        console.error('Error occurred while executing functions:', error);
    }
};

export {
    runFunctionsInOrder, 
}
