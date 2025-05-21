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
    consumeInsertQuestionMatrix
} from './routes/consume_matrix/consumer.matrix';

import {
    fetchInitialGroupeData, 
    consumeGroupData
} from './routes/consume_group/consumer.group'

import {
    fetchInitialVersionData,
    consumeVersionData
} from './routes/consume_version/consumer.version'

import {
    fetchInitialPodData,
    consumePodData,
    consumeDeletePodData
} from './routes/consume.pod/consumer.pod'

import {
    consumeCreatePodSetting, 
    consumeUpdatePodSettingGroup,
    consumeCreatePodSettingGroup,
    consumeDeleteDetailExpByGroup,
    consumeUpdatePodSetting, 
    consumeDeletePodSetting
} from './routes/consume_pod_settimg/consumer.pod.setting'

import {
    consumeInsertSelfDevSoundData, 
    consumeCreateSelfDevgGroup, 
    consumeUpdateSelfDevgGroup
} from './routes/consume_self_dev/consumer.self.dev'

import {
    consumeCreateExperiencesGroup, 
    consumeUpdateExperiencesGroup, 
    consumeDeleteExperiencesGroup
} from './routes/consume_experience_group/consumer.experiences'

import {
    consumeCreateExperiencesData,
    consumeUpdateExperiencesData, 
    consumeDeleteExperiencesData
} from './routes/consume_experiences/consumer.experiences'

const runFetchFunctionsInOrder = async () => {
    console.log("🔄 Starting data synchronization...");

    await fetchInitialVersionData()
    await fetchInitialGroupeData()
    await fetchInitialPodData()

    console.log("🎉 All Starting data synchronization executed successfully in order.");
};

const runFunctionsInOrder = async () => {
    try {
        await consumeUserData()
        await consumePodData()
        await consumeDeletePodData()
        await consumeUsersDataUpdate()
        await consumeResetPassword()
        await syncDisclaimerData()
        await consumeUpdateQuestionMatrix()
        await consumeInsertQuestionMatrix() 
        await consumeGroupData()
        await consumeCreatePodSetting()
        await consumeUpdatePodSetting()
        await consumeDeletePodSetting()
        await consumeUpdatePodSettingGroup()
        await consumeCreatePodSettingGroup()
        await consumeDeleteDetailExpByGroup()
        await consumeInsertSelfDevSoundData()
        await consumeCreateSelfDevgGroup()
        await consumeUpdateSelfDevgGroup()
        await consumeCreateExperiencesGroup()
        await consumeUpdateExperiencesGroup()
        await consumeDeleteExperiencesGroup()
        await consumeCreateExperiencesData()
        await consumeUpdateExperiencesData()
        await consumeDeleteExperiencesData()

        console.log('All functions executed successfully in order');
    } catch (error) {
        console.error('Error occurred while executing functions:', error);
    }
};

export {
    runFunctionsInOrder, 
    runFetchFunctionsInOrder
}
