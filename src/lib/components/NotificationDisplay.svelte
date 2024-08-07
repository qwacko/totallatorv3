<script lang="ts">
	import { notificationStore, type Notification } from '$lib/stores/notificationStore';
	import { Toast } from 'flowbite-svelte';
	import { blur } from 'svelte/transition';
	import SuccessIcon from './icons/SuccessIcon.svelte';
	import ErrorIcon from './icons/ErrorIcon.svelte';
	import WarningIcon from './icons/WarningIcon.svelte';
	import InfoIcon from './icons/InfoIcon.svelte';
	import { onDestroy } from 'svelte';

	const notifications = notificationStore;

	const infoNotification: Notification = {
		id: 'info',
		type: 'info',
		message: 'This is an info notification',
		creationTime: new Date()
	};

	const errorNotification: Notification = {
		id: 'error',
		type: 'error',
		message: 'This is an error notification',
		creationTime: new Date()
	};

	const successNotification: Notification = {
		id: 'success',
		type: 'success',
		message: 'This is a success notification',
		creationTime: new Date()
	};

	const successWithTitleNotification: Notification = {
		id: 'success',
		type: 'success',
		title: 'Success Title',
		message: 'This is a success notification',
		creationTime: new Date(),
		dismissable: true
	};

	const warningNotification: Notification = {
		id: 'warning',
		type: 'warning',
		message: 'This is a warning notification',
		creationTime: new Date()
	};

	const includeTest = false;

	const otherNotifications: Notification[] = includeTest
		? [
				infoNotification,
				errorNotification,
				successNotification,
				successWithTitleNotification,
				warningNotification
			]
		: [];

	$: usedNotifications = [...$notifications, ...otherNotifications].reverse();

	let time = new Date().getTime();

	const interval = setInterval(() => {
		time = new Date().getTime();
	}, 50);

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="fixed bottom-5 right-5 flex w-96 flex-col-reverse gap-4">
	{#each usedNotifications as notification}
		<Toast
			class=" w-full hover:shadow-lg"
			color={notification.type === 'success'
				? 'green'
				: notification.type === 'error'
					? 'red'
					: notification.type === 'warning'
						? 'yellow'
						: 'blue'}
			transition={blur}
			params={{ amount: 10 }}
			dismissable={notification.dismissable}
			on:close={() => notificationStore.dismiss(notification.id)}
		>
			<svelte:fragment slot="icon">
				{#if notification.type === 'success'}
					<SuccessIcon />
				{:else if notification.type === 'error'}
					<ErrorIcon />
				{:else if notification.type === 'warning'}
					<WarningIcon />
				{:else}
					<InfoIcon />
				{/if}
			</svelte:fragment>
			{#if notification.title}
				<h1 class="text-sm font-bold">{notification.title}</h1>
			{/if}

			{notification.message}

			<!-- <svelte:fragment slot="close-button">
				{#if notification.dismissable}
					{#if percentUsed}
						<Button
							on:click={() => notificationStore.dismiss(notification.id)}
							color="none"
							class="ring-0 selection:ring-0"
							style={`background: linear-gradient(to right, #ccc ${percentUsed * 100}%, transparent ${percentUsed * 100}%);`}
						>
							<CancelIcon class="text-red-600" />
						</Button>
					{:else}
						<Button
							on:click={() => notificationStore.dismiss(notification.id)}
							color="none"
							class="ring-0 selection:ring-0"
						>
							<CancelIcon class="text-red-600" />
						</Button>
					{/if}
				{:else if percentUsed}
					<Button
						on:click={() => notificationStore.dismiss(notification.id)}
						color="none"
						class="ring-0 selection:ring-0"
						style={`background: linear-gradient(to right, #ccc ${percentUsed * 100}%, transparent ${percentUsed * 100}%);`}
						disabled
					>
						<CancelIcon class="text-gray-600" />
					</Button>
				{/if}
			</svelte:fragment> -->
		</Toast>
	{/each}
</div>
