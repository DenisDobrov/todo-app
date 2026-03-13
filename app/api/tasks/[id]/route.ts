import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params

  try {
    const body = await request.json()
    const completed = Boolean(body.completed)

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', Number(id))
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

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', Number(id))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}