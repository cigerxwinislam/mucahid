// Bismillahirahmanirahim



import Carousel from 'react-bootstrap/Carousel';
import Image from 'next/image';
import mmwene from '../../public/images.jpeg';

import mmal from '../../public/mmal.png'

import mmkargeh from '../../public/kargeh.jpeg'
function Wene() {
  return (
    <Carousel>
      <Carousel.Item>
        <Image text="First slide" src={mmkargeh}/>
        <Carousel.Caption>
          <h3>İş ilanları</h3>
          <p>Nulla vitae elit libero, a pharetra augue mollis interdum.</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <Image src={mmwene} />
        <Carousel.Caption>
          <h3>Second slide label</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>

        <Image text="Evler"  src={mmal}  />
        <Carousel.Caption>
          <h3>Evler</h3>
          <p>
            Praesent commodo cursus magna, vel scelerisque nisl consectetur.
          </p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
}

export default Wene;