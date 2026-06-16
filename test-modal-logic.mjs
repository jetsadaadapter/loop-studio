#!/usr/bin/env node

// Simulate the getJobStatus function
function getJobStatus(job) {
    if ('status' in job && job.status) {
        const normalized = job.status.toLowerCase();
        if (normalized === 'running') return 'active';
        if (normalized === 'cancelled') return 'cancelled';
        return normalized;
    }
    if ('state' in job && job.state) {
        const normalized = job.state.toLowerCase();
        if (normalized === 'cancelled') return 'cancelled';
    }
    if ('error' in job && job.error) return 'failed';
    if (job.state) {
        const normalized = job.state.toLowerCase();
        if (normalized === 'running') return 'active';
        return normalized;
    }
    if ('processed' in job && job.processed) return 'completed';
    return 'active';
}

// Simulate the getIsFinished function from ProcessingModal
function getIsFinished(run) {
    if (!run) return false;
    const state = String(run.state || "").toLowerCase();

    // Check if ALL jobs in the run have reached a terminal state
    const allJobsFinished = run.jobs && run.jobs.length > 0
        ? run.jobs.every((j) => {
            const jobStatus = getJobStatus(j);
            return jobStatus === "completed" || jobStatus === "failed" || jobStatus === "cancelled";
        })
        : false;

    // Consider finished if top-level state is terminal OR all jobs are finished
    return (
        state === "completed" ||
        state === "failed" ||
        state === "cancelled" ||
        allJobsFinished
    );
}

// Test data from user
const testRun = {
    "runId": "01KV7CWVCA2V81NP5670F29GWX",
    "createdAt": "2026-06-16T05:01:35.510Z",
    "state": "active",
    "jobs": [
        {
            "jobId": "01KV7CWVCARSY9CCMYF8JHT1G7",
            "plugin": "apify",
            "state": "active",
            "label": "Scrap Comment",
            "sortOrder": 0
        },
        {
            "jobId": "01KV7CWVCAY2HVRXR70Q2Q65EK",
            "plugin": "gemini",
            "state": "queued",
            "label": "Sentiment Analyzer",
            "sortOrder": 1
        }
    ]
};

console.log('🧪 Testing Modal Close Logic\n');
console.log('Test Run State:', testRun.state);
console.log('Jobs:');
testRun.jobs.forEach((job, i) => {
    const status = getJobStatus(job);
    console.log(`  Job ${i}: state="${job.state}" -> getJobStatus="${status}"`);
});

console.log('\n📊 Check Results:');
const job0Status = getJobStatus(testRun.jobs[0]);
const job1Status = getJobStatus(testRun.jobs[1]);

console.log('Job 0 status:', job0Status);
console.log('Job 0 is terminal?', ['completed', 'failed', 'cancelled'].includes(job0Status));
console.log('Job 1 status:', job1Status);
console.log('Job 1 is terminal?', ['completed', 'failed', 'cancelled'].includes(job1Status));

const allJobsFinished = testRun.jobs.every((j) => {
    const jobStatus = getJobStatus(j);
    return jobStatus === "completed" || jobStatus === "failed" || jobStatus === "cancelled";
});

console.log('\n✅ All jobs finished?', allJobsFinished);
console.log('✅ Run state is terminal?', ['completed', 'failed', 'cancelled'].includes(testRun.state.toLowerCase()));

const isFinished = getIsFinished(testRun);
console.log('\n🎯 Final Result: isFinished =', isFinished);
console.log(isFinished ? '❌ Modal WOULD CLOSE (BUG!)' : '✅ Modal SHOULD STAY OPEN (CORRECT)');
