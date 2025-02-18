import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, VStack, Text, Button } from '@chakra-ui/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          p={6}
          borderRadius="xl"
          bg="brand.surface"
          border="1px solid"
          borderColor="red.500"
        >
          <VStack spacing={4} align="stretch">
            <Text color="red.400" fontWeight="bold">
              Something went wrong
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              {this.state.error?.message}
            </Text>
            <Button
              variant="outline"
              colorScheme="red"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}
