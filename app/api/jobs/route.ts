import { NextRequest, NextResponse } from 'next/server';
import { listJobs, ListJobsParams } from '@/lib/job-repo';
import { getAllJobs } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Try database first
    let jobs = [];
    try {
      const dbJobs = await listJobs({ limit, offset });
      jobs = dbJobs.map(dbJob => ({
        id: dbJob.external_id,
        type: dbJob.type,
        status: dbJob.status,
        progress: dbJob.progress || 0,
        prompt: dbJob.prompt,
        resultUrl: dbJob.result_url,
        error: dbJob.error,
        createdAt: new Date(dbJob.created_at),
        completedAt: dbJob.completed_at ? new Date(dbJob.completed_at) : undefined,
      }));
    } catch (error) {
      console.warn('[jobs-api] Database query failed, falling back to memory:', error);
      // Fallback to in-memory jobs
      const memoryJobs = getAllJobs();
      jobs = memoryJobs.slice(offset, offset + limit);
    }
    
    return NextResponse.json({
      jobs,
      total: jobs.length,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('[jobs-api] Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
