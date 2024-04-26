import logger from "./logger"
import mime from "mime"

export const REG_FILENAME = /[^\\/,\s\t\n]+/g
export const pathname_arr = (str = ''): string[] => (str.split(/[#?]+/)[0].replace(/^\.+\//, '').match(REG_FILENAME) || [])
export const pathname_fixer = (str = '') => pathname_arr(str).join('/')
export const pathname_dirname = (str = '') => (str.match(REG_FILENAME) || []).slice(0, -1).join('/')
export const minimatch = (str = '', pattern = '') => {
    const reg = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/,/g, '|'))
    return reg.test(str)
}

export const getMimeType = (pathname: string, mimeTypes: { [key: string]: string }) => {
    const suffix = (pathname || '').split('.').pop()  || ''
    const type = (mimeTypes && mimeTypes[suffix]) || mime.getType(suffix) as string
    return type || 'application/octet-stream'
}
export const isText = (pathname: string, mimeTypes: { [key: string]: string }) => {
    const type = getMimeType(pathname, mimeTypes)
    return /\b(html?|txt|javascript|json)\b/.test(type || 'exe')
}

export const decode = (str: string) => {
    try {
        return decodeURIComponent(str)
    } catch (e) {
        logger.warn(e)
        return str
    }
}

export const queryparams = (search: string) => {
    const searchParams = new URLSearchParams(search)
    const params: Record<string, string | string[]> = {}
    searchParams.forEach((v, k) => {
        if (params[k]) {
            params[k] = ([] as string[]).concat(params[k]).concat(v)
        } else {
            params[k] = v
        }
    })
    return params
}

export const get = function loopGet (obj: any, path: string | string[]): any {
    const [key, ...rest] = path.toString().match(REG_FILENAME) || []
    if (!key || !obj) {
        return obj
    }
    if (rest.length === 0) {
        return obj[key]
    }
    return loopGet(obj[key], rest)
}

export const set = function loopSet (obj: any, path: string | string[], value: any): any {
    const [key, ...rest] = path.toString().match(REG_FILENAME) || []
    if (!key) return
    if (rest.length === 0) {
        Object.assign(obj, {
            [key]: value
        })
    } else {
        if (!obj[key]) {
            obj[key] = {}
        }
        loopSet(obj[key], rest, value)
    }
}

export const isPlainObject = function (value: any) {
    if (!value || typeof value != 'object') {
        return false
    }
    return Object.prototype.toString.call(value) === '[object Object]'
}

/** 简单字符串模板，类似 handlebars */
export const template = function template (tpl: string, data: any, index?: number): string {
    return tpl
        .replace(/\{\{(\w+)\s+(\w+)[^{}]*\}\}([\s\S\t\r\n]*?)\{\{\/\1\}\}/g, function (_: any, fn: any, item_key: any, line: any) {
            const items = data[item_key]
            switch (fn) {
                case 'each':
                    return items ? items.map((item: any, index: number) => template(line, item, index)).join('') : ''
                case 'if':
                    return items ? template(line, items) : ''
                default:
                    return template(line, items)
            } 
        })
        .replace(/\{\{([@\$\.\w]+)\}\}/g, (__, key) => {
            switch (key) {
                case '@': return data;
                case '@index': return index;
                default: return typeof data[key] !== 'undefined' ? data[key] : ''
            }
        })
}

export const renderHTML = (body: string, data: any) => {
    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>{{title}}</title>
    </head>
    <body>${body}</body>
    </html>`
    if (!isPlainObject(data)) {
        return html
    }
    return template(html, data)
}