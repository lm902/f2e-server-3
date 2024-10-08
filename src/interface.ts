import { AppOptions, HttpRequest, HttpResponse, TemplatedApp } from 'uWebSockets.js'
import { MiddlewareCreater, MiddlewareEvents, MiddlewareReference } from './middlewares/interface';
import { MemoryTree } from './memory-tree';
import { TryFilesItem } from './middlewares/try_files/interface';
import { LiveReloadConfig } from './middlewares/livereload/interface';
import { ProxyItem } from './middlewares/proxy/interface';
import { EsbuildConfig } from './middlewares/esbuild/interface';
import { LessConfig } from './middlewares/less/interface';
import { HttpHeaders } from './utils/resp';
import { AuthConfig } from './middlewares/auth/interface';
import type { RequestOptions } from 'node:https'
import { PostCssConfig } from './middlewares/postcss/interface';
import { AliasConfig } from './middlewares/alias/interface';

export type ConfigMode = "dev" | "build" | "prod";
export const ModeOptions = ["dev", "build", "prod"] as const;
export interface APIContext {
    req: HttpRequest,
    resp: HttpResponse,
    pathname: string,
    location: URL,
    method: string,
    /** 请求头信息 */
    headers: HttpHeaders,
    store: MemoryTree.Store | undefined,
    body?: Buffer,
    /** 需要添加的响应头信息 */
    responseHeaders?: HttpHeaders,
}

/** 启动服务器相关配置 */
export interface ServerConfig {
    /** 项目根路径: 默认为process.cwd() */
    root?: string;
    /** 
     * 默认 2850,
     * 当配置端口为443的时候自动转化为 https 服务 并需要配置 app_options */
    port?: number;
    /**
     * 指定host访问生效
     * 未指定时，只要是访问端口符合就可以，相当于nginx的 servername: _
     */
    host?: string
    /**
     * 主动设置ssl 模式， 默认为 false，优先级高于 port：443
     * 配置 uWebSockets.js 的 app_options, ssl服务需要配置
     */
    ssl?: false | AppOptions;
    /**
     * 服务器 gzip 模式，默认为false
     */
    gzip?: boolean;
    /**
     * 运行时 是否对资源进行 gzip 压缩， gzip开启后生效
     * 可以根据文件路径、文件大小给出结果
     * @default function (pathname, size) { return isText(pathname) && size > 4096 }
     * @param  {string} pathname 资源路径名
     * @param  {number} size 资源大小
     * @return {boolean}
     */
    gzip_filter?: (pathname: string, size: number) => boolean;
    /**
     * 运行时 是否对资源进行 cache-control
     * 可以根据文件路径、文件大小给出结果, html文件作为入口文件，通常不需要缓存
     * @default function (pathname, size) { return !/\.html?$/.test(pathname) }
     * @param  {string} pathname 资源路径名
     * @param  {number} size 资源大小
     * @return {boolean}
     */
    cache_filter?: (pathname: string, size: number) => boolean;
    /**
     * 基础服务启动后执行
    */
    onServerCreate?: (app: TemplatedApp, conf: F2EConfigResult) => void;
    /** 映射文件后缀名到指定MIME */
    mimeTypes?: { [key: string]: string };
    /** 流数据分片大小
     * @default 1024 * 1024 * 10
     */
    range_size?: number;

    /** 默认404页面 */
    page_404?: string;
    /** 默认服务端错误页面 */
    page_50x?: string;
    /** 未设置try_files展示目录页面 */
    page_dir?: string | false;


    /**
     * 中间件 try_files 配置
     * 参考Nginx配置 `try_files` 而产生的功能
     * 1. 类型为`string`时, 所有未能找到资源的情况都转发到这个 `pathname`
     * 2. 类型为`{test, exec}[]`, 依次循环匹配`test`, 进行转发
     * @default false
     * @suggest "index.html"
     */
    try_files?: false | string | TryFilesItem | (string | TryFilesItem)[];
    /**
     * 中间件 livereload 配置
     * @default false 
     * mode = 'dev' 时： livereload = {
            prefix: 'server-sent-bit',
            heartBeatTimeout: 100000
        }
    */
    livereload?: false | LiveReloadConfig;
    /**
     * 代理配置
     */
    proxies?: ProxyItem[];
    /**
     * 中间件 esbuild配置
     * @default
     * {
     *      esbuildrc: "./esbuildrc.js",
     *      build_external: true
     * }
     */
    esbuild?: false | EsbuildConfig;
    /**
     * less配置
     * @default false
     */
    less?: false | LessConfig;
    /** auth登录认证配置 */
    auth?: false | AuthConfig;
    /**
     * 索引资源配置
     * 将原始资源映射到指定路径out
     * 原始路径支持绝对路径和相对路径，以及http(s)协议URL
     * 只在资源构建之前加载一次, 配置不当，可能被其他构建结果覆盖
    */
    alias?: false | AliasConfig;
    /** 支持postcss 以及 tailwindcss 配置 */
    postcss?: false | PostCssConfig;
}
export interface F2EConfig extends ServerConfig, Partial<MemoryTree.Options>, Partial<MiddlewareEvents> {
    /** 
     * dev模式下 开启服务器，开启资源动态编译，开启监听文件修改刷新页面 
     * build模式下 关闭服务器，开启资源动态编译并压缩
     * prod模式下 开启服务器，开启服务器资源缓存，关闭编译 【默认：prod模式】
    */
    mode?: ConfigMode;
    
    /** 中间件配置支持函数式或引用式 */
    middlewares?: (MiddlewareCreater | MiddlewareReference)[];

}


/** 通过计算得到配置 */
export type F2EConfigResult = Omit<Required<F2EConfig>, keyof MiddlewareEvents | 'middlewares'>