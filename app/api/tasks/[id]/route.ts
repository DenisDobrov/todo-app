import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const patch: Record<string, unknown> = {}

    if (typeof body.title === 'string') patch.title = body.title.trim()
    if (typeof body.completed === 'boolean') patch.completed = body.completed
    if (typeof body.priority === 'string') patch.priority = body.priority
    if ('due_at' in body) patch.due_at = body.due_at || null
    if (Array.isArray(body.tags)) {
      patch.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    }
    if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order

    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
