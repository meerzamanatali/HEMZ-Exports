import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/settings - Get all settings
export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findMany()

    // Convert flat array to key-value object
    const settingsObject: Record<string, any> = {}
    for (const setting of settings) {
      try {
        settingsObject[setting.key] = JSON.parse(setting.value)
      } catch {
        settingsObject[setting.key] = setting.value
      }
    }

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('GET /api/admin/settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings - Save settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Save or update each setting
    for (const [key, value] of Object.entries(body)) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

      await prisma.setting.upsert({
        where: { key },
        update: { value: valueStr },
        create: {
          key,
          value: valueStr,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    })
  } catch (error) {
    console.error('POST /api/admin/settings error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update specific setting
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: valueStr },
      create: {
        key,
        value: valueStr,
      },
    })

    return NextResponse.json({
      key: setting.key,
      value: JSON.parse(setting.value),
    })
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/settings - Delete setting
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    await prisma.setting.delete({
      where: { key },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/settings error:', error)
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    )
  }
}
