import React from "react"
import { ConnectButton } from "web3uikit"

const Header = () => {
    return (
        <div>
            Decentralized lottery
            <ConnectButton moralisAuth={false} />
        </div>
    )
}

export default Header
