import React from "react"
import { useMoralis, useWeb3Contract, provider, useChain } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

const LotteryEntrance = () => {
    const { chainId: chainIdHex, isWeb3Enabled, enableWeb3, Moralis, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [entranceFee, setEntranceFee] = useState("0")
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0x")

    const dispatch = useNotification()

    const { runContractFunction: enterRaffle } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    // try to read the raffle entrance fee
    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })
    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })
    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const entranceFeeResult = await getEntranceFee({
            onError: console.error,
        })
        setEntranceFee(entranceFeeResult.toString())

        const numberOfPlayersResult = await getNumberOfPlayers({
            onError: console.error,
        })
        setNumberOfPlayers(numberOfPlayersResult.toString())

        const recentWinnerResult = await getRecentWinner({
            onError: console.error,
        })
        setRecentWinner(recentWinnerResult.toString())
    }

    useEffect(() => {
        if (isWeb3Enabled && raffleAddress) {
            updateUI()
        }
    }, [isWeb3Enabled])

    useEffect(() => {
        // subscribe for events
        if (isWeb3Enabled && raffleAddress) {
            const signer = web3.getSigner() // if this is for making transactions
            const contract = new ethers.Contract(raffleAddress, abi, signer)

            contract.removeAllListeners() // do I need to cleanup here, since it should be called only once?
            contract.on("RaffleEnter", (address, tx) => {
                console.log("Someone entered raffle, updating UI", address, tx)
                updateUI()
            })
            contract.on("WinnerPicked", (address, tx) => {
                console.log("Someone won the raffle, updating UI", address, tx)
                updateUI()
            })
        }
    }, [isWeb3Enabled])

    const handleSuccess = async (tx) => {
        console.log("tx", tx)
        await tx.wait(1)
        updateUI()
        handleNewNotification(tx)
    }

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            message: "Transaction complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <>
            <div>LotteryEntrance ETH</div>
            {raffleAddress ? (
                <>
                    <div>entrance fee is {ethers.utils.formatUnits(entranceFee, "ether")} </div>
                    <div>Number of players: {numberOfPlayers}</div>
                    <div>Recent winner: {recentWinner}</div>
                    <button
                        onClick={async () =>
                            await enterRaffle({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }
                    >
                        Enter raffle!
                    </button>
                </>
            ) : (
                <div>No raffle address</div>
            )}
        </>
    )
}

export default LotteryEntrance
