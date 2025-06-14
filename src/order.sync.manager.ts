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
    consumeCreateSelfDevSoundgGroup, 
    consumeUpdateSelfDevSoundgGroup, 
    deleteSelfDevSoundData, 
    deleteSelfDevSoundDataGroup
} from './routes/consume_self_dev_sound_bounce/consumer.self.dev.sounds'

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

import {
    consumeInsertSelfDevData,
    deleteSelfDevData, 
} from './routes/consume_self_development/consumer.self.development'

import {
    consumeInsertSelfDevDataBounce,
    consumeUpdateSelfDevDataBounce,  
    deleteSelfDevDataBounce
} from './routes/consume_self_development_bounce/consumer.self.development.bounce'

import {
    consumeUpsertGlobalSettingBounce
} from './routes/consume_global_setting_bounce/consumer.global.setting'

import {
    consumeDeleteTask2, 
    consumeTask2,
    fetchInitialTaskType, 
    fetchInitialTask, 
    consumeDeleteTask2ByGroup, 
} from './routes/consume_task/consumer.task2'

import {
    consumeTaskAndNodeByGroup
} from './routes/consume_flow_editor/consume.flow.editor'

import {
    consumeNodeData, 
    consumeDeleteNodeData, 
    consumeDeleteNodeDataGroup
} from './routes/consume_node/consumer.node'

import {
    consumeReplaceExperienceData
} from './routes/consume_rwplace_experiences/consumer.experiences'

const runFetchFunctionsInOrder = async () => {
    console.log("Starting data synchronization...");

    await fetchInitialVersionData()
    await fetchInitialGroupeData()
    await fetchInitialPodData()
    await fetchInitialTaskType() 
    await fetchInitialTask()

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
        await consumeCreateSelfDevSoundgGroup()
        await consumeUpdateSelfDevSoundgGroup()
        await deleteSelfDevSoundDataGroup()
        await consumeCreateExperiencesGroup()
        await consumeUpdateExperiencesGroup()
        await consumeDeleteExperiencesGroup()
        await consumeCreateExperiencesData()
        await consumeUpdateExperiencesData()
        await consumeDeleteExperiencesData()
        await consumeInsertSelfDevData()
        await deleteSelfDevData() 
        await deleteSelfDevSoundData()
        await consumeInsertSelfDevDataBounce()
        await consumeUpdateSelfDevDataBounce()  
        await deleteSelfDevDataBounce()
        await consumeUpsertGlobalSettingBounce()
        await consumeDeleteTask2()
        await consumeDeleteNodeData()
        await consumeTask2()
        await consumeNodeData()

        await consumeReplaceExperienceData()

        // ruwet ne adohhh 
        await consumeDeleteTask2ByGroup()
        await consumeDeleteNodeDataGroup()
        await consumeTaskAndNodeByGroup()

        console.log('All functions executed successfully in order');
    } catch (error) {
        console.error('Error occurred while executing functions:', error);
    }
};

export {
    runFunctionsInOrder, 
    runFetchFunctionsInOrder
}
