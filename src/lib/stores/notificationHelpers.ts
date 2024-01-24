import { notificationStore } from './notificationStore';

export const onSuccess = (notification: string) => {
	return () => {
		notificationStore.send({
			message: notification,
			type: 'success',
			duration: 2000
		});
	};
};

export const onError = (notification: string) => {
	return () => {
		notificationStore.send({
			message: notification,
			type: 'error',
			duration: 8000,
			dismissable: true
		});
	};
};
