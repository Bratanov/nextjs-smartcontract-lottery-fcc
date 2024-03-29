import React from "react"
import { useMoralis } from "react-moralis"
import { useEffect } from "react"

const ManualHeader = () => {
    const { enableWeb3, deactivateWeb3, account, isWeb3Enabled, isWeb3EnableLoading, Moralis } =
        useMoralis()

    useEffect(() => {
        if (isWeb3Enabled) return

        if (typeof window !== "undefined" && window.localStorage.getItem("connected")) {
            enableWeb3()
        }
        console.log("isWeb3Enabled", isWeb3Enabled)
    }, [])

    useEffect(() => {
        Moralis.onAccountChanged((account) => {
            console.log(`Account changed to ${account}`)
            if (account == null) {
                if (typeof window !== "undefined") {
                    window.localStorage.removeItem("connected")
                    deactivateWeb3()
                }
            }
        })
    }, [])

    return (
        <div>
            {account ? (
                <div>Connected to {account}</div>
            ) : (
                <button
                    disabled={isWeb3EnableLoading}
                    onClick={async () => {
                        await enableWeb3()

                        if (typeof window !== "undefined" && account) {
                            window.localStorage.setItem("connected", "injected")
                        }
                    }}
                >
                    Connect
                </button>
            )}
        </div>
    )
}

export default ManualHeader
