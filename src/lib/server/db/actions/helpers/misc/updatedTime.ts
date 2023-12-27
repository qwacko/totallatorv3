export const updatedTime = () => {
    const updatedAt = new Date().toISOString()
    // console.log("UpdatedTime = ", updatedAt)
    return { updatedAt }
}
