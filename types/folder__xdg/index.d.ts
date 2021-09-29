declare module '@folder/xdg' {
    interface XDG {
        cache: string;
        config: string;
        config_dirs: [string];
        data: string;
        data_dirs: string;
        runtime: string;
        logs: string;
    }
    function xdg(): XDG;
    export = xdg;
}
