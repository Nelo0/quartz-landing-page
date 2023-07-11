import { FormEvent, ChangeEvent, useState } from 'react';
import {
  Stack,
  FormControl,
  Input,
  Button,
  useColorModeValue,
  Heading,
  Text,
  Container,
  Flex,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import axios from 'axios';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'initial' | 'submitting' | 'success'>(
    'initial'
  );
  const [error, setError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    setState('submitting');

    try {
      const response = await axios.post('https://eoew0sz5qr4inhx.m.pipedream.net', {
        email: email,
      });

      if (response.status === 200) {
        setState('success');
      } else {
        setError(true);
        setState('initial');
      }
    } catch (error) {
      setError(true);
      setState('initial');
    }
  };

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}>
      <Container
        maxW={'lg'}
        bg={useColorModeValue('white', 'whiteAlpha.100')}
        boxShadow={'xl'}
        rounded={'lg'}
        p={6}>
        <Heading
          as={'h2'}
          fontSize={{ base: 'xl', sm: '2xl' }}
          textAlign={'center'}
          mb={5}>
          Subscribe to our Newsletter
        </Heading>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          as={'form'}
          spacing={'12px'}
          onSubmit={handleSubmit}>
          <FormControl>
            <Input
              variant={'solid'}
              borderWidth={1}
              color={'gray.800'}
              _placeholder={{
                color: 'gray.400',
              }}
              borderColor={useColorModeValue('gray.300', 'gray.700')}
              id={'email'}
              type={'email'}
              required
              placeholder={'Your Email'}
              aria-label={'Your Email'}
              value={email}
              disabled={state !== 'initial'}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </FormControl>
          <FormControl w={{ base: '100%', md: '40%' }}>
            <Button
              colorScheme={state === 'success' ? 'green' : 'blue'}
              isLoading={state === 'submitting'}
              w="100%"
              type={state === 'success' ? 'button' : 'submit'}
            >
              {state === 'success' ? <CheckIcon /> : 'Submit'}
            </Button>
          </FormControl>
        </Stack>
        <Text
          mt={2}
          textAlign={'center'}
          color={error ? 'red.500' : 'gray.500'}
        >
          {error
            ? 'Oh no an error occurred! 😢 Please try again later.'
            : "You won't receive any spam! ✌️"}
        </Text>
      </Container>
    </Flex>
  );
}
