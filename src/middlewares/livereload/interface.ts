/**
 * livereload中间件参数
 * @default {
 *          prefix: 'server-sent-bit',
            heartBeatTimeout: 30000
        }
 */
export interface LiveReloadConfig {
    /** 长链接地址
     * @default server-sent-bit
    */
    prefix?: string;
    /** 心跳超时时间
     * @default 30000
    */
    heartBeatTimeout?: number;
    /**
     * 匹配html文件, 注入脚本
     * @default /index\.html$/
     */
    reg_inject?: RegExp;
    /**
     * 刷新脚本
     * @default 
     * { reload_page: 'location.reload()', reload_link: 'location.href = output', reload_script: 'location.reload()'}
     */
    reload_scripts?: {
        reload_page?: string;
        reload_link?: string;
        reload_script?: string;
    };
}
