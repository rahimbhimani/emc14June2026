import { containers, containerTypeDefinitions } from "../../data/containerData"

export default defineEventHandler(() => {
    return {
        containers,
        containerTypeDefinitions
    }
})
