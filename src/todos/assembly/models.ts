@nearBindgen
export class Todo {
    constructor(
        public author: string,
        public title: string,
        public list: Map<string, bool>
    ) { }
}
