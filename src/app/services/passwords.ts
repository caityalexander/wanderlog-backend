const hash = async (password: string): Promise<string> => {
    // todo: your hashing function goes here
    return Promise.resolve(password);
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    // todo: your comparison function goes here
    if (password === comp) {
        return Promise.resolve(true)
    } else {
        return Promise.resolve(false)
    }
}

export {hash, compare}
