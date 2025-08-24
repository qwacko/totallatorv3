<script lang="ts">
	import { Accordion, AccordionItem, Badge, Button, Card } from 'flowbite-svelte';

	import { getLogConfigurations, setLogConfiguration } from './logsDisplay.remote';

	let logConfigurations = $derived(await getLogConfigurations());

	const getUniqueArrayItems = <T extends Record<string, unknown>>(data: T[], key: keyof T) => {
		return data
			.map((item) => item[key])
			.filter((value, index, self) => self.indexOf(value) === index);
	};

	const domains = $derived(getUniqueArrayItems(logConfigurations.configurations, 'domain'));
	const actions = $derived(getUniqueArrayItems(logConfigurations.configurations, 'action'));
	const levels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];
	const destinations = $derived(
		getUniqueArrayItems(logConfigurations.configurations, 'destination')
	);

	const getLevelColor = (level: string) => {
		switch (level?.toUpperCase()) {
			case 'ERROR':
				return 'red';
			case 'WARN':
				return 'yellow';
			case 'INFO':
				return 'blue';
			case 'DEBUG':
				return 'gray';
			case 'TRACE':
				return 'gray';
			default:
				return 'gray';
		}
	};
</script>

<Card class="max-w-none">
	<!-- Header Section -->
	<div class="mb-6 flex flex-row items-center gap-3">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Log Configuration</h2>
		<Badge color="gray" class="text-xs">
			{logConfigurations.configurations.length} configurations
		</Badge>
	</div>

	<Accordion>
		{#each destinations as destination}
			{@const destinationConfigurations = logConfigurations.configurations.filter(
				(item) => item.destination === destination
			)}
			{@const foundLevels = destinationConfigurations.reduce((acc, item) => {
				acc.set(item.logLevel, (acc.get(item.logLevel) || 0) + 1);
				return acc;
			}, new Map<string, number>())}
			<AccordionItem>
				<!-- Destination Header -->
				{#snippet header()}
					<div class="flex items-center gap-3">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							Destination: {destination || 'Default'}
						</h3>
						<div class="flex gap-1">
							{#each foundLevels as [level, count]}
								<Badge color={getLevelColor(level)}>
									{level}: {count}
								</Badge>
							{/each}
						</div>
					</div>
				{/snippet}

				<!-- Global destination level controls at the top of accordion body -->
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
				>
					<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
						Set all configurations for this destination to:
					</span>
					<div class="flex flex-row items-center gap-1">
						{#each levels as level}
							{@const allAtThisLevel = destinationConfigurations.every(
								(item) => item.logLevel === level
							)}
							<form {...setLogConfiguration}>
								<input type="hidden" name="destination" value={destination} />
								<input type="hidden" name="level" value={level} />
								<Button
									type="submit"
									color={allAtThisLevel ? getLevelColor(level) : 'alternative'}
									size="xs"
								>
									{level}
								</Button>
							</form>
						{/each}
					</div>
				</div>

				<!-- Domains Section -->
				<Accordion>
					{#each domains.sort((a, b) => a
							.toLocaleString()
							.localeCompare(b.toLocaleString())) as domain}
						{@const domainConfigurations = destinationConfigurations.filter(
							(item) => item.domain === domain
						)}
						{#if domainConfigurations.length > 0}
							{@const foundDomainLevels = domainConfigurations.reduce((acc, item) => {
								acc.set(item.logLevel, (acc.get(item.logLevel) || 0) + 1);
								return acc;
							}, new Map<string, number>())}
							<AccordionItem>
								{#snippet header()}
									<div class="flex items-center gap-3">
										<span class="font-medium">Domain: {domain || 'Default'}</span>
										<Badge color="indigo">{domainConfigurations.length} configs</Badge>
										<div class="flex gap-1">
											{#each foundDomainLevels as [level, count]}
												<Badge color={getLevelColor(level)}>
													{level}: {count}
												</Badge>
											{/each}
										</div>
									</div>
								{/snippet}

								<!-- Domain level controls at the top of domain accordion body -->
								<div
									class="bg-gray-25 dark:bg-gray-750 flex items-center justify-between border-b border-gray-100 p-3 dark:border-gray-600"
								>
									<span class="text-sm font-medium text-gray-600 dark:text-gray-400">
										Set all configurations for this domain to:
									</span>
									<div class="flex flex-row items-center gap-1">
										{#each levels as level}
											{@const allAtThisLevel = domainConfigurations.every(
												(item) => item.logLevel === level
											)}
											<form {...setLogConfiguration}>
												<input type="hidden" name="domain" value={domain} />
												<input type="hidden" name="destination" value={destination} />
												<input type="hidden" name="level" value={level} />
												<Button
													type="submit"
													color={allAtThisLevel ? getLevelColor(level) : 'alternative'}
													size="xs"
												>
													{level}
												</Button>
											</form>
										{/each}
									</div>
								</div>

								<div class="space-y-3 p-4">
									{#each actions as action}
										{@const matchingConfig = logConfigurations.configurations.find(
											(item) =>
												item.domain === domain &&
												item.destination === destination &&
												item.action === action
										)}
										{#if matchingConfig}
											<div
												class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-500 dark:bg-gray-600"
											>
												<div class="flex items-center gap-3">
													<span class="font-medium text-gray-900 dark:text-white">
														Action: {action || 'Default'}
													</span>
													<Badge color={getLevelColor(matchingConfig.logLevel)}>
														Current: {matchingConfig.logLevel}
													</Badge>
												</div>

												<div class="flex flex-row items-center gap-1">
													{#each levels as level}
														<form
															{...setLogConfiguration.enhance(async ({ submit }) => {
																await submit().updates(
																	getLogConfigurations().withOverride((config) => ({
																		...config,
																		configurations: config.configurations.map((item) => {
																			if (
																				item.action === action &&
																				item.destination === destination &&
																				item.domain === domain
																			) {
																				return {
																					...item,
																					logLevel: level as any
																				};
																			}
																			return item;
																		})
																	}))
																);
															})}
														>
															<input type="hidden" name="domain" value={domain} />
															<input type="hidden" name="destination" value={destination} />
															<input type="hidden" name="action" value={action} />
															<input type="hidden" name="level" value={level} />
															<Button
																type="submit"
																color={level === matchingConfig?.logLevel
																	? getLevelColor(level)
																	: 'alternative'}
																size="xs"
															>
																{level}
															</Button>
														</form>
													{/each}
												</div>
											</div>
										{/if}
									{/each}
								</div>
							</AccordionItem>
						{/if}
					{/each}
				</Accordion>
			</AccordionItem>
		{/each}
	</Accordion>

	<!-- Configuration Summary -->
	<div class="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
		<h4 class="mb-2 text-sm font-medium text-blue-900 dark:text-blue-200">Configuration Summary</h4>
		<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
			<div>
				<span class="font-medium text-blue-700 dark:text-blue-300">Destinations:</span>
				<span class="text-blue-900 dark:text-blue-100">{destinations.length}</span>
			</div>
			<div>
				<span class="font-medium text-blue-700 dark:text-blue-300">Domains:</span>
				<span class="text-blue-900 dark:text-blue-100">{domains.length}</span>
			</div>
			<div>
				<span class="font-medium text-blue-700 dark:text-blue-300">Actions:</span>
				<span class="text-blue-900 dark:text-blue-100">{actions.length}</span>
			</div>
			<div>
				<span class="font-medium text-blue-700 dark:text-blue-300">Total Configs:</span>
				<span class="text-blue-900 dark:text-blue-100">
					{logConfigurations.configurations.length}
				</span>
			</div>
		</div>
	</div>
</Card>
