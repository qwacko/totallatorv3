import { testTracing } from '$lib/server/testTracing';

export async function GET() {
	try {
		// Generate a test trace
		await testTracing();

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Test trace sent to Tempo'
			}),
			{
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}
