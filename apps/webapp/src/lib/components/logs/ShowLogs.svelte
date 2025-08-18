<script lang="ts">
    import { Badge } from "flowbite-svelte";
 import { getLogs } from "./logsDisplay.remote";
    import {useInterval} from 'runed'
    import type { LogFilterValidationType } from "../../../../../../packages/logDatabase/dist/validation/logFilterValidation";


    let filter = $state<LogFilterValidationType>({})

    const logs = $derived(await getLogs(filter))
    let updateTime = $state(new Date())

    useInterval(async () => {
        await getLogs(filter).refresh()
        updateTime = new Date()
    }, 1000)


    const toggleItem = (key: "domain"|"action"|"contextId"|"code"|"level", value: string | undefined) => {
        if(!value){
            return
        }
        const currentValue = filter[key] || [];
        if (currentValue.includes(value as any)) {
            filter[key] = currentValue.filter(item => item !== value) as any;
        } else {
            filter[key] = [...currentValue, value as any];
        }
    }


</script>
{updateTime}
{#if filter.contextId}
{#each filter.contextId as currentContextId}<Badge onclick={() => {toggleItem("contextId",currentContextId)}}>{currentContextId}</Badge>{/each}
{/if}
{#if filter.domain}
{#each filter.domain as currentDomain}<Badge onclick={() => {toggleItem("domain",currentDomain)}}>{currentDomain}</Badge>{/each}
{/if}
{#if filter.code}
{#each filter.code as currentCode}<Badge onclick={() => {toggleItem("code",currentCode)}}>{currentCode}</Badge>{/each}
{/if}
{#if filter.level}
{#each filter.level as currentLevel}<Badge onclick={() => {toggleItem("level", currentLevel)}}>{currentLevel}</Badge>{/each}
{/if}
{#if filter.action}
{#each filter.action as currentAction}<Badge onclick={() => {toggleItem("action", currentAction)}}>{currentAction}</Badge>{/each}
{/if}
<input class="border" bind:value={filter.text} />
<table>
    <thead>
        <tr>
    <th>No.</th>
    <th>Date</th>
    <th>Title</th>
    <th>Context</th>
    <th>Domain</th>
    <th>Code</th>
    <th>Action</th>
    <th>Level</th>
            <th>Data</th>
    </tr>
    </thead>
    <tbody>
        {#each logs.logs as log, index}
            <tr>
                <td class="p-2 content-center border">{log.id}</td>
                <td class="p-2 content-center border">{log.date.toISOString()}</td>
                <td class="p-2 content-center border">{log.title}</td>
                <td class="p-2 content-center border">{#if log.contextId}
                    <Badge onclick={() => {toggleItem("contextId",log.contextId)}}>{log.contextId}</Badge>{/if}</td>
                <td class="p-2 content-center border">{#if log.domain}
                    <Badge onclick={() => {toggleItem("domain",log.domain)}}>{log.domain}</Badge>{/if}</td>
                <td class="p-2 content-center border">{#if log.code}
                    <Badge onclick={() => {toggleItem("code",log.code)}}>{log.code}</Badge>{/if}</td>
                <td class="p-2 content-center border">{#if log.action}
                    <Badge onclick={() => {toggleItem("action", log.action)}}>{log.action}</Badge>{/if}</td>
                <td class="p-2 content-center border">{#if log.logLevel}
                    <Badge onclick={() => {toggleItem("level", log.logLevel)}}>{log.logLevel}</Badge>{/if}</td>
                <td class="p-2 content-center border"><pre>{JSON.stringify(log.dataProcessed, null, 2)}</pre></td>
            </tr>
        {/each}
    </tbody>
</table>
               