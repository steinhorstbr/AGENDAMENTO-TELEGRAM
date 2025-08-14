// server/api/upload.post.ts
import { promises as fs } from 'fs'
import path from 'path'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const user = requireAuth(event)
  
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nenhum arquivo enviado'
      })
    }

    const uploadedFiles: string[] = []
    const uploadsDir = path.join(process.cwd(), 'uploads')
    
    // Criar diretório de uploads se não existir
    await fs.mkdir(uploadsDir, { recursive: true })

    for (const file of form) {
      if (file.name === 'file' && file.filename && file.data) {
        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type || '')) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Tipo de arquivo não permitido. Use apenas imagens (JPEG, PNG, GIF, WebP)'
          })
        }

        // Validar tamanho (máximo 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.data.length > maxSize) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Arquivo muito grande. Máximo 5MB'
          })
        }

        // Gerar nome único
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2)
        const extension = path.extname(file.filename)
        const newFilename = `${timestamp}_${randomId}_${user.id}${extension}`
        
        const filePath = path.join(uploadsDir, newFilename)
        
        // Salvar arquivo
        await fs.writeFile(filePath, file.data)
        
        // Retornar URL relativa
        uploadedFiles.push(`/uploads/${newFilename}`)
      }
    }

    if (uploadedFiles.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nenhum arquivo válido encontrado'
      })
    }

    return {
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    }
    
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno no upload'
    })
  }
})

// server/api/files/[...path].delete.ts
export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const user = requireAuth(event)
  
  const filePath = getRouterParam(event, 'path')
  
  if (!filePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Caminho do arquivo não especificado'
    })
  }

  try {
    const fullPath = path.join(process.cwd(), 'uploads', filePath)
    
    // Verificar se o arquivo existe
    try {
      await fs.access(fullPath)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Arquivo não encontrado'
      })
    }
    
    // Verificar se o usuário pode deletar este arquivo
    // (baseado no nome do arquivo que contém o ID do usuário)
    if (!filePath.includes(`_${user.id}.`) && user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para deletar este arquivo'
      })
    }
    
    // Deletar arquivo
    await fs.unlink(fullPath)
    
    return {
      success: true,
      message: 'Arquivo deletado com sucesso'
    }
    
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Delete file error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao deletar arquivo'
    })
  }
})