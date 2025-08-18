<script lang="ts">
import { getLogConfigurations, setLogConfiguration } from "./logsDisplay.remote";

let logConfigurations = $derived(await getLogConfigurations())

const getUniqueArrayItems = <T extends Record<string, unknown>>(data: T[], key: keyof T) => {
    return data.map(item => item[key]).filter((value, index, self) => self.indexOf(value) === index);
};

const domains = $derived(getUniqueArrayItems(logConfigurations.configurations,"domain"));
const actions = $derived(getUniqueArrayItems(logConfigurations.configurations,"action"));
const levels = ["TRACE","DEBUG","INFO","WARN","ERROR"];
const destinations = $derived(getUniqueArrayItems(logConfigurations.configurations,"destination"));


</script>
<div class="flex flex-col gap-2">
{#each destinations as destination}
    {@const destinationConfigurations = logConfigurations.configurations.filter(item => item.destination === destination)}
    {@const foundLevels = destinationConfigurations.reduce((acc,item) => {
        acc.set(item.logLevel, (acc.get(item.logLevel) || 0) + 1);
        return acc;
    }, new Map<string, number>())}
	<div class="flex p-3 flex-row gap-2 self-stretch">
		<h3 class="flex font-bold">Destination</h3>
		<p class="flex">{destination || "No Destination"}</p>
         <div class="flex flex-row gap-2">
                    {#each levels as level}
                        {@const allAtThisLevel = destinationConfigurations.every(item => item.logLevel === level)}
                        <form {...setLogConfiguration}>
                            <input type="hidden" name="destination" value={destination} />
                            <input type="hidden" name="level" value={level} />
                            <button type="submit"  class:bg-red-200={allAtThisLevel}>{level}</button>
                        </form>
                    {/each}
                    {#if foundLevels.size > 1}
                        {#each foundLevels as [level, count]}
                            <p>{level}: {count}</p>
                        {/each}
                    {/if}
                </div>
	</div>
    {#each domains as domain}
        {@const domainConfigurations = destinationConfigurations.filter(item => item.domain === domain)}
        <div class="flex p-3 border rounded-md flex-col">
            <h3 class="flex font-bold">Domain</h3>
            <p class="flex">{domain || "No Domain"}</p>
       
         <div class="flex flex-row gap-2">
                    {#each levels as level}
                        {@const allAtThisLevel = domainConfigurations.every(item => item.logLevel === level)}
                        <form {...setLogConfiguration}>
                            <input type="hidden" name="domain" value={domain} />
                            <input type="hidden" name="destination" value={destination} />
                            <input type="hidden" name="level" value={level} />
                            <button type="submit"  class:bg-red-200={allAtThisLevel}>{level}</button>
                        </form>
                    {/each}
                </div>
                 </div>
        {#each actions as action}
            {@const matchingConfig = logConfigurations.configurations.find(item => item.domain === domain && item.destination === destination && item.action === action)}
            <div class="flex p-3 border rounded-md flex-col">
                <h3 class="flex font-bold">Action</h3>
                <p class="flex">{action || "No Action"}</p>
                <div class="flex flex-row gap-2">
                    {#each levels as level}
                        <form {...setLogConfiguration.enhance(async ({submit}) => {
                            await submit().updates(
                            getLogConfigurations().withOverride(config => ({
                                ...config, configurations: config.configurations.map(item => {
                                if(item.action === action && item.destination === destination && item.domain === domain){
                                    return {
                                        ...item, logLevel: level as any
                                    }
                                }
                                return item
                                })
                            })))


                        })}>
                            <input type="hidden" name="domain" value={domain} />
                            <input type="hidden" name="destination" value={destination} />
                            <input type="hidden" name="action" value={action} />
                            <input type="hidden" name="level" value={level} />
                            <button type="submit" class:bg-red-200={level === matchingConfig?.logLevel}>{level}</button>
                        </form>
                    {/each}
                </div>
            </div>
        {/each}
{/each} 
{/each}
</div>

